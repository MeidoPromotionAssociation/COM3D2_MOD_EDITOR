import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {SelectFile} from "../../wailsjs/go/main/App";
import {getFileExtension} from "../utils/utils";
import {message} from "antd";


// 1. handleSelectFile 选择文件，并转跳到对应页面
// 2. handleSaveFile 保存文件，只是提示用户没有文件可以保存
// fileTypes: 要选择的文件类型，例如 "*.menu;*.mate;*.pmat;*.col;*.phy"
// description: 选择文件对话框的描述
const useFileHandlers = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();

    const handleSelectFile = async (fileTypes: string, description: string) => {
        try {
            const filePath = await SelectFile(fileTypes, description);
            if (filePath) {
                const extension = getFileExtension(filePath);
                switch (extension) {
                    case "menu":
                        navigate("/menu-editor", {state: {filePath}});
                        break;
                    case "mate":
                        navigate("/mate-editor", {state: {filePath}});
                        break;
                    case "pmat":
                        navigate("/pmat-editor", {state: {filePath}});
                        break;
                    case "col":
                        navigate("/col-editor", {state: {filePath}});
                        break;
                    case "phy":
                        navigate("/phy-editor", {state: {filePath}});
                        break;
                    default:
                        message.error(t('Errors.file_type_not_supported'));
                }
            }
        } catch (err) {
            message.error(t('Errors.file_selection_error_colon') + err);
        }
    };

    const handleSaveFile = () => {
        message.warning(t('Errors.no_file_to_save'));
    };

    return {handleSelectFile, handleSaveFile};
};


export default useFileHandlers;
